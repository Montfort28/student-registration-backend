// backend/swagger.js

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Student Registration API',
      version: '1.0.0',
      description: 'API for registering and managing students and admins',
    },
    servers: [
      {
        url: 'http://localhost:5000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [ { bearerAuth: [] } ],
  },
  apis: ['./routes/*.js'],
};

const specs = swaggerJsdoc(options);

// ✅ Correct export of a function
function loadSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

module.exports = loadSwagger;
