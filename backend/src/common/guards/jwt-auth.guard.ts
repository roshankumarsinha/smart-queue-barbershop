import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Thin wrapper over passport's 'jwt' strategy so we can reference it by class.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
