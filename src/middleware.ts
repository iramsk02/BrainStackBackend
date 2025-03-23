import express, { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken"
//@ts-ignore
import JWT_SECRET from './config'



export default function authenticateToken(req: Request, res: Response, next: NextFunction): void {


  const token = req.headers.authorization;

  if (!token) {
    res.status(401).send({ message: "Token missing" });
    return;
  }

  jwt.verify(token, JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: "Invalid or expired token" });

      return;
    }
 
    next();

  })


}