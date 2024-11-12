import { FastifyInstance } from 'fastify';

import { callExternalApi } from "@nx-golang-monorepo/nodejs-external-api-client";

export default async function (fastify: FastifyInstance) {
  fastify.get('/', async function () {
    const result = await callExternalApi();

    return {
      message: 'Hello API',
      result,
    };
  });
}
