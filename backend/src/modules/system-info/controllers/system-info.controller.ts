import { HealthService } from '@modules/system-info/services/health.service';
import { NextFunction, Request, Response } from 'express';
import { StatusCode } from 'status-code-enum';
import Container from 'typedi';
import { GetSystemInfoResponseDto } from '../dtos/get-system-info.dto';

export class SystemInfoController {
  private healthService = Container.get(HealthService);

  public getSystemInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const systemInfo = await this.healthService.getSystemInfo();
      res.status(StatusCode.SuccessOK).json(new GetSystemInfoResponseDto(systemInfo));
    } catch (error) {
      next(error);
    }
  };
}
