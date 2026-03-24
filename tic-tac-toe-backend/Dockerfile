FROM heroiclabs/nakama:3.21.1

COPY ./local.yml /nakama/data/local.yml
COPY ./build /nakama/data/modules

CMD ["--config", "/nakama/data/local.yml", "--database.address", "postgresql://tic_tac_toe_db_fssg_user:CJOeRoDfkwl9ypPX4Tgn5bIIsl0GFR5S@dpg-d714vf24d50c73beje3g-a.oregon-postgres.render.com/tic_tac_toe_db_fssg"]