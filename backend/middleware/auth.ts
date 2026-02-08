import { Request, Response, NextFunction } from 'express';
import { expressjwt } from 'express-jwt';
import jwksRsa from 'jwks-rsa';
import dotenv from 'dotenv';
import { getUser, getUserByExternalAuthId } from '../api/services/users';
dotenv.config();

declare global {
    namespace Express {
        interface Request {
            user?: { role?: string, userId?: string, therapistId?: string };
        }
    }
}

const checkJwt = expressjwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256'],
    requestProperty: 'user',
});

const enrichUserFromDb = async (req: Request, res: Response, next: NextFunction) => {
    const sub = (req.user as any)?.sub;
    if (!sub) return next();
    try {
        const user = await getUserByExternalAuthId(sub);
        if (user) {
            (req.user as any).userId = user.user_id;
            (req.user as any).role = user.role;
        }
    } catch {
    }
    next();
};

const requiredRoles = (role: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.user?.role !== role) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

const requiredRoleIn = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user?.role || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
};

const requiredUserId = (req: Request, res: Response, next: NextFunction) => {
    const requestedUserId = req.params.user_id;
    const authUserId = req.user?.userId;
    if (!authUserId || requestedUserId !== authUserId) {
        return res.status(403).json({ message: 'Forbidden: access restricted to the user' });
    }
    next();
};

const requiredTherapistId = (req: Request, res: Response, next: NextFunction) => {
    const requestedTherapistId = req.params.therapist_id;
    const authUserId = req.user?.userId;
    if (!authUserId || requestedTherapistId !== authUserId) {
        return res.status(403).json({ message: 'Forbidden: access restricted to the therapist' });
    }
    next();
};

const requireUserOrTherapist = async (req: Request, res: Response, next: NextFunction) => {
    const requestedUserId = req.params.user_id;
    const authUserId = req.user?.userId;
    if (!authUserId) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    if (requestedUserId === authUserId) {
        return next(); 
    }
    try {
        const requestedUser = await getUser(requestedUserId);
        if (requestedUser?.therapist_id === authUserId) {
            return next(); 
        }
    } catch {
    }
    return res.status(403).json({ message: 'Forbidden: access restricted to the user or their therapist' });
};

export { checkJwt, enrichUserFromDb, requiredRoles, requiredRoleIn, requiredUserId, requiredTherapistId, requireUserOrTherapist };
