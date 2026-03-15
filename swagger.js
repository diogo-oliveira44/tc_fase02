var swaggerUi = require('swagger-ui-express');

var openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'API para criação de posts',
    version: '1.0.0',
    description: 'Documentação da API para criação, leitura, atualização, exclusão e busca de posts em um blog'
  },
  servers: [
    {
      url: 'http://localhost:3030/'
    }
  ],
  tags: [
    {
      name: 'Posts',
      description: 'Crie, edite, atualize e exclusa postagens do blog'
    }
  ],
  components: {
    schemas: {
      Post: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            example: 1
          },
          title: {
            type: 'string',
            example: 'Fase 2 postech inicia em Janeiro'
          },
          content: {
            type: 'string',
            example: 'Aqui vai todo o conteúdo do seu post, que pode ser bem longo e detalhado.'
          },
          author: {
            type: 'string',
            example: 'Maria Silva'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        },
        required: ['id', 'title', 'content', 'author', 'created_at', 'updated_at']
      },
      PostInput: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            example: 'Fase 2 postech inicia em Janeiro'
          },
          content: {
            type: 'string',
            example: 'Aqui vai todo o conteúdo do seu post, que pode ser bem longo e detalhado.'
          },
          author: {
            type: 'string',
            example: 'Ada Lovelace'
          }
        },
        required: ['title', 'content', 'author']
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Post not found.'
          }
        },
        required: ['error']
      }
    }
  },
  paths: {
    '/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Liste as postagens',
        description: 'Irá retornar as últimas 5 postagens, caso deseje todos os registros, passe a query string type=all',
        parameters: [
          {
            in: 'query',
            name: 'type',
            schema: {
              type: 'string',
              enum: ['all']
            },
            description: 'Passar "all" para retornar todos os posts, caso contrário, apenas os 5 mais recentes serão retornados.'
          }
        ],
        responses: {
          200: {
            description: 'Uma lista de postagens',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Post'
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Posts'],
        summary: 'Crie um post',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PostInput'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'O post criado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Post'
                }
              }
            }
          },
          400: {
            description: 'Requisição inválida. Verifique o corpo da requisição',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/posts/search': {
      get: {
        tags: ['Posts'],
        summary: 'Busque posts',
        parameters: [
          {
            in: 'query',
            name: 'q',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'Busque posts por título ou conteúdo. A busca é case-insensitive e irá retornar todos os posts que contiverem a string de busca no título ou conteúdo.'
          }
        ],
        responses: {
          200: {
            description: 'Postagens encontradas',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Post'
                  }
                }
              }
            }
          },
          400: {
            description: 'Requisição inválida. Verifique a query string "q"',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    },
    '/posts/{id}': {
      get: {
        tags: ['Posts'],
        summary: 'Busque uma postagem por ID',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          200: {
            description: 'A postagem solicitada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Post'
                }
              }
            }
          },
          400: {
            description: 'ID inválida, não é um número inteiro.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          404: {
            description: 'Postagem não encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Posts'],
        summary: 'Atualize uma postagem',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PostInput'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'A postagem atualizada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Post'
                }
              }
            }
          },
          400: {
            description: 'Requisição inválida',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          404: {
            description: 'Postagem não encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Posts'],
        summary: 'Delete uma postagem',
        parameters: [
          {
            in: 'path',
            name: 'id',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        responses: {
          204: {
            description: 'A postagem foi excluida'
          },
          400: {
            description: 'ID inválida, não é um número inteiro.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          },
          404: {
            description: 'Postagem não encontrada',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error'
                }
              }
            }
          }
        }
      }
    }
  }
};

function registerSwagger(app) {
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    explorer: true
  }));
}

module.exports = {
  openApiDocument: openApiDocument,
  registerSwagger: registerSwagger
};
