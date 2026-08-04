import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  async function validateDto(input: Record<string, unknown>) {
    const dto = plainToInstance(ChangePasswordDto, input);
    return validate(dto);
  }

  it('rejects mismatched confirmation', async () => {
    const errors = await validateDto({
      currentPassword: 'ChangeMe123!',
      newPassword: 'NewPass123!',
      newPasswordConfirmation: 'OtherPass1!',
    });

    expect(errors.some((e) => e.property === 'newPasswordConfirmation')).toBe(
      true,
    );
  });

  it('rejects weak new password (under 8 characters)', async () => {
    const errors = await validateDto({
      currentPassword: 'ChangeMe123!',
      newPassword: 'short',
      newPasswordConfirmation: 'short',
    });

    expect(errors.some((e) => e.property === 'newPassword')).toBe(true);
  });

  it('accepts matching passwords of sufficient length', async () => {
    const errors = await validateDto({
      currentPassword: 'ChangeMe123!',
      newPassword: 'NewPass123!',
      newPasswordConfirmation: 'NewPass123!',
    });

    expect(errors).toHaveLength(0);
  });
});
