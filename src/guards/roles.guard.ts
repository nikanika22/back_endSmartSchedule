import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "src/decorators/roles.decorator";
import { UserRole } from "src/students/entities/student.entity";

@Injectable()
export class RoleGuard implements CanActivate{
    constructor(private reflector:Reflector){}
    canActivate(context: ExecutionContext): boolean {
        const requireRoles=this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY,[
            context.getHandler(),
            context.getClass(),
        ])

        if(!requireRoles){
            return true;
        }

        const {user}=context.switchToHttp().getRequest();
        const  hasRole =  user && requireRoles.includes(user.role);
         console.log("User nè cả nhà ",user);
     if(!hasRole){
        throw new ForbiddenException('you do not have permission to access this resource')
     }

     return true;
    }
}