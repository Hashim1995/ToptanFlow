import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';

function createHost(request: { method: string; url: string }) {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn<unknown, [ApiErrorResponse]>().mockReturnThis(),
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('AllExceptionsFilter', () => {
  const request = { method: 'GET', url: '/api/v1/health' };

  function createFilter(nodeEnv: string) {
    const configService = {
      get: jest.fn().mockReturnValue(nodeEnv),
    } as unknown as ConfigService;
    return new AllExceptionsFilter(configService);
  }

  it('maps a known HttpException to the consistent error shape', () => {
    const filter = createFilter('production');
    const { host, response } = createHost(request);

    filter.catch(new NotFoundException('Not found'), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Not found',
        path: request.url,
      }),
    );
  });

  it('hides the internal error message in production for unexpected errors', () => {
    const filter = createFilter('production');
    const { host, response } = createHost(request);

    filter.catch(new Error('leaking a database credential'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    const [body] = response.json.mock.calls[0];
    expect(body.message).toBe('An unexpected error occurred.');
    expect(body.message).not.toContain('database credential');
    expect('stack' in body).toBe(false);
  });

  it('exposes the error message (but never a stack trace) outside production', () => {
    const filter = createFilter('development');
    const { host, response } = createHost(request);

    filter.catch(new Error('something failed'), host);

    const [body] = response.json.mock.calls[0];
    expect(body.message).toBe('something failed');
    expect('stack' in body).toBe(false);
  });
});
