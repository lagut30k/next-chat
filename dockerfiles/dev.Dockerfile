FROM node:24.11.0-alpine3.22 as base

# adding apk deps to avoid node-gyp related errors and some other stuff. adds turborepo globally
RUN apk add -f --update --no-cache --virtual .gyp nano bash libc6-compat python3 make g++ \
      && npm i --global turbo@^2
##      && yarn global add turbo \
#      && apk del .gyp
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN npm i --global turbo@^2
#############################################

FROM base AS pruned
WORKDIR /app
ARG APP
COPY . .

# see https://turbo.build/repo/docs/reference/command-line-reference#turbo-prune---scopetarget
RUN turbo prune --scope=$APP --docker

#############################################
FROM base AS installer
WORKDIR /app
ARG APP

COPY --from=pruned /app/out/json/ .
COPY --from=pruned /app/out/package-lock.json /app/package-lock.json

COPY apps/${APP}/package.json /app/apps/${APP}/package.json

# TODO: figure out how to use npm cache
RUN \
    --mount=type=cache,target=~/.npm,sharing=locked \
    npm ci
# see https://github.com/moby/buildkit/blob/master/frontend/dockerfile/docs/reference.md#run---mounttypecache
#RUN \
#      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
#      yarn --prefer-offline --frozen-lockfile

COPY --from=pruned /app/out/full/ .
COPY turbo.json turbo.json

# For example: `--filter=frontend^...` means all of frontend's dependencies will be built, but not the frontend app itself (which we don't need to do for dev environment)
RUN turbo run build --no-cache --filter=${APP}^...

# ?????
# re-running yarn ensures that dependencies between workspaces are linked correctly
RUN \
    --mount=type=cache,target=~/.npm,sharing=locked \
    npm ci
#RUN \
#      --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked \
#      yarn --prefer-offline --frozen-lockfile

#############################################
FROM base AS runner
WORKDIR /app
ARG APP
ARG START_COMMAND=dev
ENV APP ${APP}
ENV START_COMMAND ${START_COMMAND}

COPY --from=installer /app .

CMD turbo run ${START_COMMAND} --filter=${APP}...
#CMD npm run ${START_COMMAND} -w ${APP}
