/* eslint-disable @typescript-eslint/no-explicit-any */
export type ObjectIndexType = { [key: string]: any };
export type PayloadType = string | ObjectIndexType;

/**
 * @category Static Classes
 */
export const OidcUtils = {
  ObjectAssign: (objects: object[]) => {
    return objects.reduce(function (
      target: ObjectIndexType,
      source: ObjectIndexType
    ) {
      Object.keys(source || {}).forEach((key) => {
        target[key] = source[key];
      });
      return target;
    },
    {});
  },
  ParseJwt: (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        base64
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return {};
    }
  },
  PayloadItem: (payload: PayloadType, option: string): any => {
    if (payload) {
      if (typeof payload === "string") {
        return payload;
      } else {
        if (option in payload) {
          if (payload.option) return option;
        }
      }
    }
    return null;
  },
  ErrorPayload: (context: string, error: Error): PayloadType => {
    return {
      context,
      error: error.message ? error.message : error,
    };
  },
  FirstLetterUppercase: (string: string) => {
    return string && string.length > 0
      ? string.charAt(0).toUpperCase() + string.slice(1)
      : "";
  },
};
