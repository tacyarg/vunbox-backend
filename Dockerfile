FROM node as build
WORKDIR /app
COPY . .
RUN yarn install

FROM node
COPY --from=build /app /
CMD ["node", "index.js"]