import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const googleEnabled = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'tu_google_client_id';

@Injectable()
export class GoogleOAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    if (!googleEnabled) {
      return false;
    }
    const guard = new (AuthGuard('google'))();
    return guard.canActivate(context);
  }
}
