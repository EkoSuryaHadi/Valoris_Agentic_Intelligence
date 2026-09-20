function pathToRegex(path) {
  if (path instanceof RegExp) {
    return { regex: path, keys: [] };
  }
  const keys = [];
  const pattern = path
    .replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { regex: new RegExp(`^${pattern}$`), keys };
}

export function createRouter() {
  const routes = [];

  function add(method, pathOrPaths, ...handlers) {
    const paths = Array.isArray(pathOrPaths) ? pathOrPaths : [pathOrPaths];
    for (const path of paths) {
      const { regex, keys } = pathToRegex(path);
      routes.push({
        method: method.toUpperCase(),
        path,
        regex,
        keys,
        handlers: handlers.flat()
      });
    }
  }

  function match(method, pathname) {
    const normalizedMethod = method.toUpperCase();
    let methodMismatch = false;

    for (const route of routes) {
      const matchResult = pathname.match(route.regex);
      if (matchResult) {
        if (route.method === normalizedMethod || route.method === 'ALL') {
          const params = {};
          route.keys.forEach((key, index) => {
            params[key] = matchResult[index + 1];
          });
          return {
            handlers: route.handlers,
            params,
            route: route.path
          };
        }
        methodMismatch = true;
      }
    }

    return {
      handlers: null,
      params: {},
      methodMismatch
    };
  }

  return {
    add,
    get: (path, ...handlers) => add('GET', path, ...handlers),
    post: (path, ...handlers) => add('POST', path, ...handlers),
    put: (path, ...handlers) => add('PUT', path, ...handlers),
    delete: (path, ...handlers) => add('DELETE', path, ...handlers),
    all: (path, ...handlers) => add('ALL', path, ...handlers),
    match,
    routes: () => [...routes]
  };
}
