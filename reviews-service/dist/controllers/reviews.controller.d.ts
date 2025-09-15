import type { Request, Response } from "express";
export declare function createReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getReviews(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getReviewById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getReviewsByProduct(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=reviews.controller.d.ts.map