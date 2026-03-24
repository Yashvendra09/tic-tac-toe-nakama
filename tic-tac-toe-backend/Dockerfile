FROM heroiclabs/nakama:3.21.1

COPY ./local.yml /nakama/data/local.yml
COPY ./build /nakama/data/modules

CMD ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address \"$DATABASE_URL\" && exec /nakama/nakama --config /nakama/data/local.yml --socket.port $PORT --console.port $(($PORT+1)) --metrics.prometheus_port $(($PORT+2)) --database.address \"$DATABASE_URL\""]