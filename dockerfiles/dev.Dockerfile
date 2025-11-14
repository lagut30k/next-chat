FROM node:24.11.0-alpine3.22 as base

RUN apk add -f --update --no-cache --virtual .gyp nano bash libc6-compat python3 make g++
RUN apk update
RUN apk add --no-cache libc6-compat
RUN npm i --global turbo@^2

WORKDIR /app
#############################################

FROM base AS pruned
WORKDIR /app
COPY . .

ARG APP
# see https://turbo.build/repo/docs/reference/command-line-reference#turbo-prune---scopetarget
RUN turbo prune --scope=$APP --docker

#############################################
FROM base AS installer
WORKDIR /app
ARG APP

COPY --from=pruned /app/out/json/ .
COPY --from=pruned /app/out/package-lock.json /app/package-lock.json

#COPY apps/${APP}/package.json /app/apps/${APP}/package.json

# TODO: figure out how to use npm cache
RUN \
    --mount=type=cache,target=~/.npm,sharing=locked \
    npm ci

COPY --from=pruned /app/out/full/ .
COPY turbo.json turbo.json

# For example: `--filter=frontend^...` means all of frontend's dependencies will be built, but not the frontend app itself (which we don't need to do for dev environment)
RUN turbo run build --no-cache --filter=${APP}^...

# ?????
# re-running yarn ensures that dependencies between workspaces are linked correctly
RUN \
    --mount=type=cache,target=~/.npm,sharing=locked \
    npm ci

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
