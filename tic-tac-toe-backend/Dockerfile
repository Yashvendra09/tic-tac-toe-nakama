FROM heroiclabs/nakama:3.21.1

COPY ./local.yml /nakama/data/local.yml
COPY ./build /nakama/data/modules

CMD ["/nakama/nakama", "--config", "/nakama/data/local.yml"]        