import { Service } from 'typedi';
import { GetInformationDto } from '@modules/news/dtos/information.dto';

@Service()
export class InformationService {
  public async get(): Promise<GetInformationDto> {
    return {};
  }
}
