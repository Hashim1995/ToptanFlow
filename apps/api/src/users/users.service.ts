import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { SortOrder } from '../common/sorting/sort-order.enum';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { hashPassword } from './password.util';

const userSelect = {
  id: true,
  fullName: true,
  username: true,
  isActive: true,
  isSuperAdmin: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type UserRecord = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const fullName = this.normalizeRequiredText('fullName', dto.fullName);
    const username = this.normalizeRequiredText('username', dto.username);
    this.assertPasswordPresent(dto.password);

    const passwordHash = await hashPassword(dto.password);

    try {
      const user = await this.prisma.user.create({
        data: {
          fullName,
          username,
          passwordHash,
          isSuperAdmin: false,
        },
        select: userSelect,
      });
      return this.toResponse(user);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async list(query: ListUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const sortBy = query.sortBy ?? 'username';
    const sortOrder = query.sortOrder ?? SortOrder.ASC;

    const where = this.buildListWhere(query);

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.user.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    return {
      data: data.map((user) => this.toResponse(user)),
      meta: {
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toResponse(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    if (!this.hasAtLeastOneUpdateField(dto)) {
      throw new BadRequestException('At least one field must be provided');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (dto.isActive === false) {
      this.assertMayDeactivate(existing);
    }

    const data: {
      fullName?: string;
      username?: string;
      passwordHash?: string;
      isActive?: boolean;
    } = {};

    if (dto.fullName !== undefined) {
      data.fullName = this.normalizeRequiredText('fullName', dto.fullName);
    }

    if (dto.username !== undefined) {
      const username = this.normalizeRequiredText('username', dto.username);
      data.username = username;

      if (username !== existing.username) {
        const duplicate = await this.prisma.user.findFirst({
          where: {
            username,
            NOT: { id },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException('Username already exists');
        }
      }
    }

    if (dto.password !== undefined) {
      this.assertPasswordPresent(dto.password);
      data.passwordHash = await hashPassword(dto.password);
    }

    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data,
        select: userSelect,
      });
      return this.toResponse(user);
    } catch (error: unknown) {
      this.rethrowUniqueAsConflict(error);
      throw error;
    }
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!existing) {
      throw new NotFoundException('User not found');
    }

    if (!existing.isActive) {
      return this.toResponse(existing);
    }

    this.assertMayDeactivate(existing);

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });
    return this.toResponse(user);
  }

  private assertMayDeactivate(user: UserRecord): void {
    // Super Admin is the root operator (ADR-039): never soft-deactivate.
    if (user.isSuperAdmin) {
      throw new ForbiddenException({
        message: 'Super Admin cannot be deactivated',
        code: 'SUPERADMIN_IMMUTABLE',
      });
    }
  }

  private buildListWhere(
    query: ListUsersQueryDto,
  ): Prisma.UserWhereInput | undefined {
    const conditions: Prisma.UserWhereInput[] = [];

    if (query.isActive !== undefined) {
      conditions.push({ isActive: query.isActive });
    }

    const search = query.search?.trim();
    if (search) {
      conditions.push({
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { fullName: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (conditions.length === 0) {
      return undefined;
    }

    if (conditions.length === 1) {
      return conditions[0];
    }

    return { AND: conditions };
  }

  private normalizeRequiredText(field: string, value: string): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new BadRequestException(`${field} must not be empty`);
    }
    return trimmed;
  }

  private assertPasswordPresent(password: string): void {
    if (password.trim().length === 0) {
      throw new BadRequestException('password must not be empty');
    }
  }

  private hasAtLeastOneUpdateField(dto: UpdateUserDto): boolean {
    return (
      dto.fullName !== undefined ||
      dto.username !== undefined ||
      dto.password !== undefined ||
      dto.isActive !== undefined
    );
  }

  private toResponse(user: UserRecord): UserResponseDto {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private rethrowUniqueAsConflict(error: unknown): void {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Username already exists');
    }
  }
}
