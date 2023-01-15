/* eslint-disable @typescript-eslint/no-explicit-any */

import { IdTokenClaims, OidcClientSettings, User } from "oidc-client-ts";
import {
  OidcStoreOidcClientSettings,
  OidcUser,
  PayloadType,
  OidcUserProfile,
  ObjectIndexType
} from "../types";

interface KeyMapper<T, K> {
  included?: string[];
  excluded?: string[];
  exception?: { [key: string]: { transform: (source: T, target: K) => void } };
}

const user_To_OidcUserMapper: KeyMapper<User, OidcUser> = {
  exception: {
    profile: {
      transform: (source, target) => {
        target.profile = source.profile as OidcUserProfile;
      },
    },
  },
};

const oidcUser_To_UserMapper: KeyMapper<OidcUser, User> = {
  exception: {
    profile: {
      transform: (source, target) => {
        target.profile = source.profile as IdTokenClaims;
      },
    },
  },
};

const MapObjects = (
  source: ObjectIndexType,
  target: ObjectIndexType,
  keyMapper?: KeyMapper<any, any>
) => {
  if (keyMapper) {
    if (keyMapper.included) {
      keyMapper.included.forEach((k) => {
        const exception = keyMapper.exception?.[k];
        if (exception) exception.transform(source, target);
        else target[k] = source[k];
      });
    } else {
      Object.keys(source || {}).forEach((k) => {
        if (keyMapper.excluded?.indexOf(k) === -1) {
          const exception = keyMapper.exception?.[k];
          if (exception) exception.transform(source, target);
          else target[k] = source[k];
        }
      });
    }
  } else {
    Object.keys(source || {}).forEach((k) => {
      target[k] = source[k];
    });
  }
  return target;
};
/**
 * @category Static Classes
 */
export const OidcObjectMapper = {
  OidcClientSettings_To_OidcStoreOidcClientSettings: (source: PayloadType) => {
    const target = {};
    MapObjects(source as ObjectIndexType, target);
    return target as OidcStoreOidcClientSettings;
  },
  OidcStoreOidcClientSettings_To_OidcClientSettings: (source: PayloadType) => {
    const target = {};
    MapObjects(source as ObjectIndexType, target);
    return target as OidcClientSettings;
  },
  User_To_OidcUser: (source: PayloadType) => {
    const target = {};
    MapObjects(source as ObjectIndexType, target, user_To_OidcUserMapper);
    return target as OidcUser;
  },
  OidcUser_To_User: (source: PayloadType) => {
    const target = {};
    MapObjects(source as ObjectIndexType, target, oidcUser_To_UserMapper);
    return target as User;
  },
};
