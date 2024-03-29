/* eslint-disable @typescript-eslint/no-explicit-any */
import { PayloadType, ObjectIndexType } from "../types";
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
      return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
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
