import { CreateBulletinQuestionAnswerDto } from '@modules/bulletin/dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '@modules/bulletin/dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '@modules/bulletin/dtos/create-bulletin.dto';
import { UpdateBulletinDto } from '@modules/bulletin/dtos/update-bulletin.dto';
import { BulletinRoutes } from '@modules/bulletin/routes/bulletin.routes';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class BulletinHelpers {
  constructor(private app: ITestApp) {}

  public async get(id: string, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async create(model: CreateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(BulletinRoutes.path)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async update(id: number, model: UpdateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .put(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async publish(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(`${BulletinRoutes.path}/${id}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async delete(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .delete(`${BulletinRoutes.path}/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getAll(page?: number, limit?: number, accessToken?: string): Promise<Response> {
    let url = `${BulletinRoutes.path}`;
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (params.toString()) url += '?' + params.toString();

    return await request(this.app.getServer()).get(url).set('Authorization', `Bearer ${accessToken}`).send();
  }

  public async getPublished(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/published`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getUserProgress(bulletinId: number, userId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/${bulletinId}/progress/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async exportToPdf(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/${id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async downloadPdf(id: number): Promise<Response> {
    return await request(this.app.getServer()).get(`${BulletinRoutes.path}/${id}/download`).send();
  }

  public async createQuestion(model: CreateBulletinQuestionDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(`${BulletinRoutes.path}/questions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async answerQuestion(model: CreateBulletinQuestionAnswerDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(`${BulletinRoutes.path}/questions/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async getBulletinQuestions(bulletinId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/${bulletinId}/questions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getQuestionAnswers(questionId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`${BulletinRoutes.path}/questions/${questionId}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
