var app = require('../app');
var swagger = require('../swagger');

describe('swagger integration', function() {
  it('exposes the expected OpenAPI metadata', function() {
    expect(swagger.openApiDocument.openapi).toBe('3.0.3');
    expect(swagger.openApiDocument.paths['/posts']).toBeDefined();
    expect(swagger.openApiDocument.paths['/posts/search']).toBeDefined();
    expect(swagger.openApiDocument.paths['/posts/{id}']).toBeDefined();
  });

  it('mounts the docs and spec routes on the app', function() {
    var routePaths = app._router.stack
      .filter(function(layer) {
        return layer.route;
      })
      .map(function(layer) {
        return layer.route.path;
      });

    var middlewarePatterns = app._router.stack
      .filter(function(layer) {
        return !layer.route && layer.regexp;
      })
      .map(function(layer) {
        return String(layer.regexp);
      });

    expect(middlewarePatterns.some(function(pattern) {
      return pattern.indexOf('\\/swagger\\/?') !== -1;
    })).toBe(true);
  });
});
