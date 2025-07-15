import * as config from '@config';
import { events, ILoginModel } from '@core';
import { BadRequestException, errorKeys } from '@exceptions';
import { testHelpers } from '@helpers';
import { getAdminLoginData } from '@utils';
import { google } from 'googleapis';
import request from 'supertest';
import { TestApp } from '../../../helpers/test-helpers/test.app';
import { GetCalendarEventsResponseDto, ICalendarEventDto } from '../dtos/calendar.dto';
import { CalendarRoutes } from '../routes/calendar.routes';
import { GoogleCalendarService } from '../services/google-calendar.service';
import { testEventHandlers } from './../../../helpers/event-handler-tests.helper';

describe('GET /calendar/events', () => {
  let app: TestApp | undefined;
  let adminAccessToken: string | undefined;

  beforeAll(async () => {
    app = await testHelpers.getTestApp();
    app.mock_nodemailer_createTransport();
    const { email, passcode } = getAdminLoginData();
    adminAccessToken = (await app.auth.loginAs({ email, passcode } satisfies ILoginModel))?.accessToken;
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('GET should respond with a status code of 200', () => {
    it('when valid date range is provided', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-01T09:00:00Z'),
          end: new Date('2025-05-01T10:00:00Z'),
          title: 'Team Meeting',
          location: 'Conference Room A',
          allDay: false,
        },
        {
          start: new Date('2025-05-02T00:00:00Z'),
          end: new Date('2025-05-03T00:00:00Z'),
          title: 'Company Holiday',
          location: null,
          allDay: true,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2025-05-01';
      const endDate = '2025-05-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.calendar.eventsRetrieved);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);

      const firstEvent = body.data[0];
      expect(firstEvent.title).toBe('Team Meeting');
      expect(firstEvent.location).toBe('Conference Room A');
      expect(firstEvent.allDay).toBe(false);

      const secondEvent = body.data[1];
      expect(secondEvent.title).toBe('Company Holiday');
      expect(secondEvent.location).toBeNull();
      expect(secondEvent.allDay).toBe(true);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledWith(expect.any(Date), expect.any(Date));
    });

    it('when no events are returned', async () => {
      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue([]);

      const startDate = '2025-06-01';
      const endDate = '2025-06-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.calendar.eventsRetrieved);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(0);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when GoogleCalendarService returns undefined', async () => {
      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(undefined);

      const startDate = '2025-05-01';
      const endDate = '2025-05-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.calendar.eventsRetrieved);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(0);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when date parameters are not provided', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-01T09:00:00Z'),
          end: new Date('2025-05-01T10:00:00Z'),
          title: 'Default Meeting',
          location: 'Online',
          allDay: false,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.calendar.eventsRetrieved);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(1);

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when all-day events are returned', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-10T00:00:00Z'),
          end: new Date('2025-05-10T23:59:59Z'),
          title: 'Company Site',
          location: 'Resort',
          allDay: true,
        },
        {
          start: new Date('2025-05-15T00:00:00Z'),
          end: new Date('2025-05-16T23:59:59Z'),
          title: 'Conference',
          location: 'Convention Center',
          allDay: true,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2025-05-01';
      const endDate = '2025-05-31';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(typeof body).toBe('object');
      expect(body.message).toBe(events.calendar.eventsRetrieved);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBe(2);

      expect(body.data.every((event: any) => event.allDay === true)).toBe(true);
      expect(body.data[0].title).toBe('Company Site');
      expect(body.data[1].title).toBe('Conference');

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when events with various properties are returned', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-05T14:00:00Z'),
          end: new Date('2025-05-05T15:30:00Z'),
          title: 'Meeting with Client',
          location: 'Zoom',
          allDay: false,
        },
        {
          start: new Date('2025-05-06T09:00:00Z'),
          end: new Date('2025-05-06T17:00:00Z'),
          title: 'Team Building',
          location: null, // Missing location
          allDay: false,
        },
        {
          start: new Date('2025-05-07T00:00:00Z'),
          end: new Date('2025-05-07T23:59:59Z'),
          title: null, // Missing title
          location: 'Office',
          allDay: true,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2025-05-01';
      const endDate = '2025-05-31';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body as GetCalendarEventsResponseDto;
      expect(body.data.length).toBe(3);

      expect(body.data[0].title).toBe('Meeting with Client');
      expect(body.data[0].location).toBe('Zoom');

      expect(body.data[1].title).toBe('Team Building');
      expect(body.data[1].location).toBeNull();

      expect(body.data[2].title).toBeNull();
      expect(body.data[2].location).toBe('Office');

      Object.entries(testEventHandlers)
        .filter(([, eventHandler]) => ![testEventHandlers.onCalendarEventsRetrieved].includes(eventHandler))
        .forEach(([, eventHandler]) => {
          expect(eventHandler).not.toHaveBeenCalled();
        });
      expect(testEventHandlers.onCalendarEventsRetrieved).toHaveBeenCalledTimes(1);
    });

    it('when trying to access with invalid token', async () => {
      const startDate = '2025-05-01';
      const endDate = '2025-05-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', 'Bearer invalid-token-123');

      expect(response.statusCode).toBe(200);
    });

    it('when trying to access without authentication', async () => {
      const startDate = '2025-05-01';
      const endDate = '2025-05-07';

      const response = await request(app!.getServer()).get(
        `${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`,
      );

      expect(response.statusCode).toBe(200);
    });

    it('when start date is in the past', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2020-01-01T09:00:00Z'),
          end: new Date('2020-01-01T10:00:00Z'),
          title: 'Past Meeting',
          location: 'Office',
          allDay: false,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2020-01-01';
      const endDate = '2020-01-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Past Meeting');

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when date range spans DST change', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-03-29T09:00:00Z'), // Before DST change
          end: new Date('2025-03-29T10:00:00Z'),
          title: 'Before DST Meeting',
          location: 'Room A',
          allDay: false,
        },
        {
          start: new Date('2025-03-30T09:00:00Z'), // After DST change in many regions
          end: new Date('2025-03-30T10:00:00Z'),
          title: 'After DST Meeting',
          location: 'Room B',
          allDay: false,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2025-03-29';
      const endDate = '2025-03-31';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(2);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when specifying only start date without end date', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-15T14:00:00Z'),
          end: new Date('2025-05-15T15:00:00Z'),
          title: 'Single Day Event',
          location: 'Online',
          allDay: false,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const startDate = '2025-05-15';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when specifying only end date without start date', async () => {
      const mockEvents: ICalendarEventDto[] = [
        {
          start: new Date('2025-05-20T14:00:00Z'),
          end: new Date('2025-05-20T15:00:00Z'),
          title: 'End Date Event',
          location: 'Online',
          allDay: false,
        },
      ];

      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockResolvedValue(mockEvents);

      const endDate = '2025-05-21';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);

      expect(GoogleCalendarService.prototype.getEvents).toHaveBeenCalledTimes(1);
    });

    it('when Google Calendar API returns events with dateTime format', async () => {
      jest
        .spyOn(GoogleCalendarService.prototype, 'getEvents')
        .mockImplementation(async function (_startDate, _endDate) {
          const parseDateTime = (this as any).parseDateTime.bind(this);
          const date1 = parseDateTime('2025-05-10T09:00:00+02:00');
          const date2 = parseDateTime('2025-05-10T11:00:00+02:00');

          return [
            {
              start: date1,
              end: date2,
              title: 'Timezone Test Event',
              location: 'Virtual',
              allDay: false,
            },
          ];
        });

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=2025-05-10&end=2025-05-11`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Timezone Test Event');
    });

    it('when Google Calendar API returns events with date format (all-day events)', async () => {
      jest
        .spyOn(GoogleCalendarService.prototype, 'getEvents')
        .mockImplementation(async function (_startDate, _endDate) {
          const getStartDate = (this as any).getStartDate.bind(this);
          const getEndDate = (this as any).getEndDate.bind(this);

          const start = getStartDate({ date: '2025-05-15' }); // All-day event
          const end = getEndDate({ date: '2025-05-16' }); // End date processing for all-day event

          return [
            {
              start: start,
              end: end,
              title: 'All Day Format Test',
              location: 'Everywhere',
              allDay: true,
            },
          ];
        });

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=2025-05-14&end=2025-05-17`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('All Day Format Test');
      expect(response.body.data[0].allDay).toBe(true);
    });

    it('when handling special date cases including undefined and null values', async () => {
      jest
        .spyOn(GoogleCalendarService.prototype, 'getEvents')
        .mockImplementation(async function (_startDate, _endDate) {
          const parseDateTime = (this as any).parseDateTime.bind(this);
          const getDate = (this as any).getDate.bind(this);

          parseDateTime(null);
          parseDateTime('');
          parseDateTime(undefined);

          getDate(undefined);
          getDate({ dateTime: '', date: '' });
          getDate({});

          return [
            {
              start: new Date('2025-05-25T10:00:00Z'),
              end: new Date('2025-05-25T11:00:00Z'),
              title: 'Edge Case Test Event',
              location: 'Test Location',
              allDay: false,
            },
          ];
        });

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=2025-05-25&end=2025-05-26`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Edge Case Test Event');
    });
  });

  describe('GET should respond with a status code of 400', () => {
    test('when invalid date format is provided', async () => {
      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockImplementation(() => {
        throw new Error('expect(received).toBe(expected)');
      });

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=invalid-date&end=2025-05-07`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(400);
    });

    test('when provided start date is non ISO format', async () => {
      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=05/01/2025&end=2025-05-07`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: activateMessage, args: activateArgs } = data;
      expect(activateMessage).toBe(errorKeys.calendar.Invalid_Start_Date);
      expect(activateArgs).toEqual({ startDate: '05/01/2025' });

      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });

    test('when provided end date is non ISO format', async () => {
      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=2025-05-01&end=05/07/2025`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
      const body = response.body;
      expect(typeof body).toBe('object');
      const data = body.data as BadRequestException;
      const { message: activateMessage, args: activateArgs } = data;
      expect(activateMessage).toBe(errorKeys.calendar.Invalid_End_Date);
      expect(activateArgs).toEqual({ endDate: '05/07/2025' });

      Object.entries(testEventHandlers).forEach(([, eventHandler]) => {
        expect(eventHandler).not.toHaveBeenCalled();
      });
    });
  });

  describe('GET should handle errors', () => {
    test('when GoogleCalendarService throws an error', async () => {
      jest.spyOn(GoogleCalendarService.prototype, 'getEvents').mockImplementation(() => {
        throw new Error('Failed to retrieve calendar events');
      });

      const startDate = '2025-05-01';
      const endDate = '2025-05-07';

      const response = await request(app!.getServer())
        .get(`${CalendarRoutes.path}/events?start=${startDate}&end=${endDate}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));

      const body = response.body;
      expect(typeof body).toBe('object');
      expect(body.data.message).toBe('Failed to retrieve calendar events');
    });
  });

  describe('GoogleCalendarService tests', () => {
    let googleCalendarService: GoogleCalendarService;

    beforeEach(() => {
      googleCalendarService = new GoogleCalendarService();
    });

    test('parseDateTime should handle various date formats', () => {
      const parseDateTime = (googleCalendarService as any).parseDateTime.bind(googleCalendarService);

      expect(parseDateTime('2025-05-01T09:00:00Z')).toBeInstanceOf(Date);
      expect(parseDateTime('2025-05-01')).toBeInstanceOf(Date);

      const result = parseDateTime('');
      expect(result).toBeInstanceOf(Date);

      expect(parseDateTime(null)).toBeInstanceOf(Date);
    });

    test('getDate should handle different date formats', () => {
      const getDate = (googleCalendarService as any).getDate.bind(googleCalendarService);

      expect(getDate({ dateTime: '2025-05-01T09:00:00Z' })).toBeInstanceOf(Date);

      expect(getDate({ date: '2025-05-01' })).toBeInstanceOf(Date);

      expect(getDate(undefined)).toBeUndefined();

      expect(getDate({ dateTime: '', date: '' })).toBeUndefined();
    });

    test('getStartDate should handle all-day events', () => {
      const getStartDate = (googleCalendarService as any).getStartDate.bind(googleCalendarService);

      const result = getStartDate({ date: '2025-05-01' });
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);

      const dateTime = '2025-05-01T09:00:00Z';
      expect(getStartDate({ dateTime })).toEqual(new Date(dateTime));
    });

    test('getEndDate should handle all-day events', () => {
      const getEndDate = (googleCalendarService as any).getEndDate.bind(googleCalendarService);

      const result = getEndDate({ date: '2025-05-02' });
      expect(result).toBeInstanceOf(Date);
      expect(result.toISOString().split('T')[0]).toBe('2025-05-01');

      const dateTime = '2025-05-01T17:00:00Z';
      expect(getEndDate({ dateTime })).toEqual(new Date(dateTime));
    });

    test('getStartDate should handle null and undefined values', () => {
      const getStartDate = (googleCalendarService as any).getStartDate.bind(googleCalendarService);
      expect(getStartDate(undefined)).toBeUndefined();
      expect(getStartDate(null)).toBeUndefined();
      expect(getStartDate({})).toBeUndefined();
      expect(getStartDate({ date: '' })).toBeUndefined();
      expect(getStartDate({ dateTime: '' })).toBeUndefined();
    });

    test('getEndDate should handle null and undefined values', () => {
      const getEndDate = (googleCalendarService as any).getEndDate.bind(googleCalendarService);
      expect(getEndDate(undefined)).toBeUndefined();
      expect(getEndDate(null)).toBeUndefined();
      expect(getEndDate({})).toBeUndefined();
      expect(getEndDate({ date: '' })).toBeUndefined();
      expect(getEndDate({ dateTime: '' })).toBeUndefined();
    });

    test('should handle different time zone formats in event data', () => {
      const parseDateTime = (googleCalendarService as any).parseDateTime.bind(googleCalendarService);

      expect(parseDateTime('2025-05-01T09:00:00+01:00')).toBeInstanceOf(Date);
      expect(parseDateTime('2025-05-01T09:00:00-05:00')).toBeInstanceOf(Date);
    });

    test('should handle all-day events with different date formats', () => {
      const getStartDate = (googleCalendarService as any).getStartDate.bind(googleCalendarService);
      const getEndDate = (googleCalendarService as any).getEndDate.bind(googleCalendarService);

      const startResult = getStartDate({ date: '2025-05-05' });
      expect(startResult).toBeInstanceOf(Date);
      expect(startResult.getUTCHours()).toBe(0);
      expect(startResult.getUTCMinutes()).toBe(0);

      const endResult = getEndDate({ date: '2025-05-05' });
      expect(endResult).toBeInstanceOf(Date);
      expect(endResult.toISOString().split('T')[0]).toBe('2025-05-04');
    });

    test('should handle edge cases in calendar data', () => {
      const getDate = (googleCalendarService as any).getDate.bind(googleCalendarService);

      expect(getDate({})).toBeUndefined();

      expect(getDate({ dateTime: '2025-05-05T10:00:00Z', date: '2025-05-05' })).toEqual(
        new Date('2025-05-05T10:00:00Z'),
      );
    });

    test('should properly handle the isAllDayEvent detection', () => {
      const isAllDayEvent = (googleCalendarService as any).isAllDayEvent.bind(googleCalendarService);

      expect(isAllDayEvent({ date: '2025-05-01' })).toBe(true);
      expect(isAllDayEvent({ dateTime: '2025-05-01T09:00:00Z' })).toBe(false);
      expect(isAllDayEvent(undefined)).toBe(false);
      expect(isAllDayEvent(null)).toBe(false);
      expect(isAllDayEvent({})).toBe(false);
      expect(isAllDayEvent({ date: '' })).toBe(false);
    });

    test('should handle event processing correctly', () => {
      const processEvent = (googleCalendarService as any).processEvent.bind(googleCalendarService);

      const completeEvent = {
        summary: 'Complete Event',
        location: 'Some Location',
        start: { dateTime: '2025-05-01T09:00:00Z' },
        end: { dateTime: '2025-05-01T10:00:00Z' },
      };

      const result1 = processEvent(completeEvent);
      expect(result1).toMatchObject({
        title: 'Complete Event',
        location: 'Some Location',
        allDay: false,
      });

      const allDayEvent = {
        summary: 'All Day Event',
        location: 'Everywhere',
        start: { date: '2025-05-01' },
        end: { date: '2025-05-02' },
      };

      const result2 = processEvent(allDayEvent);
      expect(result2).toMatchObject({
        title: 'All Day Event',
        location: 'Everywhere',
        allDay: true,
      });

      const minimalEvent = {
        start: { dateTime: '2025-05-01T09:00:00Z' },
        end: { dateTime: '2025-05-01T10:00:00Z' },
      };

      const result3 = processEvent(minimalEvent);
      expect(result3.title).toBeUndefined();
      expect(result3.location).toBeUndefined();
    });

    test('should handle events processing correctly', () => {
      const processEvents = (googleCalendarService as any).processEvents.bind(googleCalendarService);

      const apiResponse = {
        items: [
          {
            summary: 'Test Event 1',
            location: 'Location 1',
            start: { dateTime: '2025-05-01T09:00:00Z' },
            end: { dateTime: '2025-05-01T10:00:00Z' },
          },
          {
            summary: 'Test Event 2',
            start: { date: '2025-05-02' },
            end: { date: '2025-05-03' },
          },
        ],
      };

      const results = processEvents(apiResponse.items);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(2);
      expect(results[0].title).toBe('Test Event 1');
      expect(results[1].allDay).toBe(true);
    });

    test('should handle events processing correctly when events are null', () => {
      const processEvents = (googleCalendarService as any).processEvents.bind(googleCalendarService);

      const apiResponse = {
        items: null,
      };

      const results = processEvents(apiResponse.items);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    test('should handle events processing correctly when events are undefined', () => {
      const processEvents = (googleCalendarService as any).processEvents.bind(googleCalendarService);

      const apiResponse = {
        items: undefined,
      };

      const results = processEvents(apiResponse.items);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(0);
    });

    it('should handle getEvents correctly when GOOGLE_API_CLIENT_ID is not set', async () => {
      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_ID', '');
      const googleCalendarService = new GoogleCalendarService();

      const events = await googleCalendarService.getEvents(new Date('2025-05-01'), new Date('2025-05-07'));
      expect(events).toEqual([]);
    });

    it('should handle getEvents correctly when GOOGLE_API_CLIENT_SECRET is not set', async () => {
      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_SECRET', '');
      const googleCalendarService = new GoogleCalendarService();

      const events = await googleCalendarService.getEvents(new Date('2025-05-01'), new Date('2025-05-07'));
      expect(events).toEqual([]);
    });

    it('should handle getEvents correctly when GOOGLE_CALENDAR_ID is not set', async () => {
      jest.replaceProperty(config, 'GOOGLE_CALENDAR_ID', '');
      const googleCalendarService = new GoogleCalendarService();

      const events = await googleCalendarService.getEvents(new Date('2025-05-01'), new Date('2025-05-07'));
      expect(events).toEqual([]);
    });

    test('should mock Google Calendar API calls', async () => {
      const mockCalendarInstance = {
        events: {
          list: jest.fn().mockResolvedValue({
            data: {
              items: [
                {
                  summary: 'API Test Event',
                  location: 'API Test Location',
                  start: { dateTime: '2025-05-01T09:00:00Z' },
                  end: { dateTime: '2025-05-01T10:00:00Z' },
                },
              ],
            },
          }),
        },
      };

      const originalCalendarMethod = google.calendar;

      google.calendar = jest.fn().mockReturnValue(mockCalendarInstance);

      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_ID', 'test-client-id');
      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_SECRET', 'test-client-secret');
      jest.replaceProperty(config, 'GOOGLE_API_REFRESH_TOKEN', 'test-refresh-token');
      jest.replaceProperty(config, 'GOOGLE_CALENDAR_ID', 'test-calendar-id');

      const service = new GoogleCalendarService();

      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-07');
      const events = await service.getEvents(startDate, endDate);

      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: expect.anything() });
      expect(mockCalendarInstance.events.list).toHaveBeenCalledWith({
        calendarId: 'test-calendar-id',
        timeMin: startDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeMax: endDate.toISOString(),
      });

      expect(events).toHaveLength(1);
      expect(events![0]).toMatchObject({
        title: 'API Test Event',
        location: 'API Test Location',
        allDay: false,
      });

      google.calendar = originalCalendarMethod;
    });

    test('should handle getEvents correctly when Google Calendar API calls return null', async () => {
      const mockCalendarInstance = {
        events: {
          list: jest.fn().mockResolvedValue({
            data: null,
          }),
        },
      };

      const originalCalendarMethod = google.calendar;

      google.calendar = jest.fn().mockReturnValue(mockCalendarInstance);

      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_ID', 'test-client-id');
      jest.replaceProperty(config, 'GOOGLE_API_CLIENT_SECRET', 'test-client-secret');
      jest.replaceProperty(config, 'GOOGLE_API_REFRESH_TOKEN', 'test-refresh-token');
      jest.replaceProperty(config, 'GOOGLE_CALENDAR_ID', 'test-calendar-id');

      const service = new GoogleCalendarService();

      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-07');
      const events = await service.getEvents(startDate, endDate);

      expect(google.calendar).toHaveBeenCalledWith({ version: 'v3', auth: expect.anything() });
      expect(mockCalendarInstance.events.list).toHaveBeenCalledWith({
        calendarId: 'test-calendar-id',
        timeMin: startDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        timeMax: endDate.toISOString(),
      });

      expect(events).toHaveLength(0);

      google.calendar = originalCalendarMethod;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  });

  afterAll(async () => {
    await testHelpers.closeTestApp();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
});
