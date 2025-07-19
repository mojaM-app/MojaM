import { CreateBulletinQuestionAnswerDto } from '@modules/bulletin/dtos/create-bulletin-question-answer.dto';
import { CreateBulletinQuestionDto } from '@modules/bulletin/dtos/create-bulletin-question.dto';
import { CreateBulletinDto } from '@modules/bulletin/dtos/create-bulletin.dto';
import { PublishBulletinDto } from '@modules/bulletin/dtos/publish-bulletin.dto';
import { UpdateBulletinDto } from '@modules/bulletin/dtos/update-bulletin.dto';
import request, { Response } from 'supertest';
import { ITestApp } from './test-helpers.interface';

export class BulletinHelpers {
  constructor(private app: ITestApp) {}

  public async get(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async create(model: CreateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post('/api/bulletins')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async update(id: number, model: UpdateBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .put(`/api/bulletins/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async publish(id: number, model: PublishBulletinDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post(`/api/bulletins/${id}/publish`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async delete(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .delete(`/api/bulletins/${id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getAll(page?: number, limit?: number, accessToken?: string): Promise<Response> {
    let url = '/api/bulletins';
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (params.toString()) url += '?' + params.toString();

    return await request(this.app.getServer())
      .get(url)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getPublished(accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get('/api/bulletins/published')
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getUserProgress(bulletinId: number, userId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/${bulletinId}/progress/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async exportToPdf(id: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/${id}/pdf`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async downloadPdf(id: number): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/${id}/download`)
      .send();
  }

  public async createQuestion(model: CreateBulletinQuestionDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post('/api/bulletins/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async answerQuestion(model: CreateBulletinQuestionAnswerDto, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .post('/api/bulletins/questions/answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(model);
  }

  public async getBulletinQuestions(bulletinId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/${bulletinId}/questions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }

  public async getQuestionAnswers(questionId: number, accessToken?: string): Promise<Response> {
    return await request(this.app.getServer())
      .get(`/api/bulletins/questions/${questionId}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send();
  }
}
