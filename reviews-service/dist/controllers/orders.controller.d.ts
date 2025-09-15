import type { Request, Response } from 'express';
export declare function createOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrders(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrderById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteOrder(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orders.controller.d.ts.map