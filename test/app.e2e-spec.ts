import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { App } from 'supertest/types';

describe('GraphQL (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Makes', () => {
    it('should query makesCount', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ makesCount }',
        })
        .expect(200)
        .expect((res: { body: { data: { makesCount: number } } }) => {
          expect(res.body.data).toHaveProperty('makesCount');
          expect(typeof res.body.data.makesCount).toBe('number');
        });
    });

    it('should query makes with pagination', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            makes(skip: 0, take: 5) {
              id
              makeId
              makeName
              vehicleTypes {
                id
                typeId
                typeName
              }
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: {
              data: {
                makes: Array<{ id: number; makeId: number; makeName: string }>;
              };
            };
          }) => {
            expect(res.body.data).toHaveProperty('makes');
            expect(Array.isArray(res.body.data.makes)).toBe(true);
            expect(res.body.data.makes.length).toBeLessThanOrEqual(5);
            if (res.body.data.makes.length > 0) {
              const make = res.body.data.makes[0];
              expect(make).toHaveProperty('id');
              expect(make).toHaveProperty('makeId');
              expect(make).toHaveProperty('makeName');
            }
          },
        );
    });

    it('should query single make by id', async () => {
      const makesResponse = await request(app.getHttpServer() as App)
        .post('/graphql')
        .send({ query: '{ makes(take: 1) { id } }' });

      const makes = makesResponse.body.data?.makes;
      if (!makes || makes.length === 0) {
        return;
      }

      const makeId = makes[0].id;
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            make(id: ${makeId}) {
              id
              makeId
              makeName
              vehicleTypes {
                id
                typeId
                typeName
              }
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: {
              data: { make: { id: number; makeId: number; makeName: string } };
            };
          }) => {
            expect(res.body.data).toHaveProperty('make');
            expect(res.body.data.make.id).toBe(makeId);
          },
        );
    });

    it('should return error for non-existent make', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ make(id: 999999) { id makeName } }',
        })
        .expect(200)
        .expect((res: { body: { errors?: Array<{ message: string }> } }) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors!.length).toBeGreaterThan(0);
          expect(res.body.errors![0].message).toContain('not found');
        });
    });

    it('should search makes by name', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            searchMakes(name: "a", take: 5) {
              id
              makeId
              makeName
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: { data: { searchMakes: Array<{ makeName: string }> } };
          }) => {
            expect(res.body.data).toHaveProperty('searchMakes');
            expect(Array.isArray(res.body.data.searchMakes)).toBe(true);
            res.body.data.searchMakes.forEach((make) => {
              expect(make.makeName.toLowerCase()).toContain('a');
            });
          },
        );
    });
  });

  describe('Vehicle Types', () => {
    it('should query vehicleTypesCount', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ vehicleTypesCount }',
        })
        .expect(200)
        .expect((res: { body: { data: { vehicleTypesCount: number } } }) => {
          expect(res.body.data).toHaveProperty('vehicleTypesCount');
          expect(typeof res.body.data.vehicleTypesCount).toBe('number');
        });
    });

    it('should query vehicleTypes with pagination', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            vehicleTypes(skip: 0, take: 5) {
              id
              typeId
              typeName
              makeId
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: {
              data: {
                vehicleTypes: Array<{
                  id: number;
                  typeId: number;
                  typeName: string;
                }>;
              };
            };
          }) => {
            expect(res.body.data).toHaveProperty('vehicleTypes');
            expect(Array.isArray(res.body.data.vehicleTypes)).toBe(true);
            expect(res.body.data.vehicleTypes.length).toBeLessThanOrEqual(5);
            if (res.body.data.vehicleTypes.length > 0) {
              const type = res.body.data.vehicleTypes[0];
              expect(type).toHaveProperty('id');
              expect(type).toHaveProperty('typeId');
              expect(type).toHaveProperty('typeName');
              expect(type).toHaveProperty('makeId');
            }
          },
        );
    });

    it('should query single vehicleType by id', async () => {
      const typesResponse = await request(app.getHttpServer() as App)
        .post('/graphql')
        .send({ query: '{ vehicleTypes(take: 1) { id } }' });

      const types = typesResponse.body.data?.vehicleTypes;
      if (!types || types.length === 0) {
        return;
      }

      const typeId = types[0].id;
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            vehicleType(id: ${typeId}) {
              id
              typeId
              typeName
              makeId
            }
          }`,
        })
        .expect(200)
        .expect((res: { body: { data: { vehicleType: { id: number } } } }) => {
          expect(res.body.data).toHaveProperty('vehicleType');
          expect(res.body.data.vehicleType.id).toBe(typeId);
        });
    });

    it('should return error for non-existent vehicleType', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ vehicleType(id: 999999) { id typeName } }',
        })
        .expect(200)
        .expect((res: { body: { errors?: Array<{ message: string }> } }) => {
          expect(res.body.errors).toBeDefined();
          expect(res.body.errors!.length).toBeGreaterThan(0);
          expect(res.body.errors![0].message).toContain('not found');
        });
    });

    it('should query vehicleTypes by makeId', async () => {
      const makesResponse = await request(app.getHttpServer() as App)
        .post('/graphql')
        .send({ query: '{ makes(take: 1) { makeId } }' });

      const makes = makesResponse.body.data?.makes;
      if (!makes || makes.length === 0) {
        return;
      }

      const makeId = makes[0].makeId;
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            vehicleTypesByMakeId(makeId: ${makeId}) {
              id
              typeId
              typeName
              makeId
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: { data: { vehicleTypesByMakeId: Array<{ makeId: number }> } };
          }) => {
            expect(res.body.data).toHaveProperty('vehicleTypesByMakeId');
            expect(Array.isArray(res.body.data.vehicleTypesByMakeId)).toBe(
              true,
            );
            res.body.data.vehicleTypesByMakeId.forEach((type) => {
              expect(type.makeId).toBe(makeId);
            });
          },
        );
    });

    it('should search vehicleTypes by name', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            searchVehicleTypes(name: "car", take: 5) {
              id
              typeId
              typeName
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: {
            body: { data: { searchVehicleTypes: Array<{ typeName: string }> } };
          }) => {
            expect(res.body.data).toHaveProperty('searchVehicleTypes');
            expect(Array.isArray(res.body.data.searchVehicleTypes)).toBe(true);
            res.body.data.searchVehicleTypes.forEach((type) => {
              expect(type.typeName.toLowerCase()).toContain('car');
            });
          },
        );
    });
  });

  describe('Make with Vehicle Types relationship', () => {
    it('should query make with nested vehicleTypes', async () => {
      const makesResponse = await request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            makes(take: 1) {
              id
              makeId
              makeName
              vehicleTypes {
                id
                typeId
                typeName
              }
            }
          }`,
        });

      expect(makesResponse.status).toBe(200);
      expect(makesResponse.body.data).toHaveProperty('makes');

      const makes = makesResponse.body.data.makes;
      if (makes.length > 0) {
        const make = makes[0];
        expect(make).toHaveProperty('vehicleTypes');
        expect(Array.isArray(make.vehicleTypes)).toBe(true);
      }
    });

    it('should query makeByMakeId', async () => {
      const makesResponse = await request(app.getHttpServer() as App)
        .post('/graphql')
        .send({ query: '{ makes(take: 1) { makeId } }' });

      const makes = makesResponse.body.data?.makes;
      if (!makes || makes.length === 0) {
        return;
      }

      const makeId = makes[0].makeId;
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: `{
            makeByMakeId(makeId: ${makeId}) {
              id
              makeId
              makeName
              vehicleTypes {
                id
                typeId
                typeName
              }
            }
          }`,
        })
        .expect(200)
        .expect(
          (res: { body: { data: { makeByMakeId: { makeId: number } } } }) => {
            expect(res.body.data).toHaveProperty('makeByMakeId');
            expect(res.body.data.makeByMakeId.makeId).toBe(makeId);
          },
        );
    });
  });

  describe('Error handling', () => {
    it('should handle invalid query syntax', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ invalidSyntax',
        })
        .expect(400);
    });

    it('should handle unknown field', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ unknownField }',
        })
        .expect(400);
    });

    it('should handle missing required argument', () => {
      return request(app.getHttpServer() as App)
        .post('/graphql')
        .send({
          query: '{ make { id } }',
        })
        .expect(400);
    });
  });
});
