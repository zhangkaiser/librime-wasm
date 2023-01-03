
#define APP_NAME "rime.decoder"
#define USER_DATA_DIR "/data/user"
#define SHARED_DATA_DIR "/shared_data"
#define BUILT_DATA_DIR "/data/build"
// #define LOG_DATA_DIR "./data/log"
// #define MIN_LOG_LEVEL 0
#define SPS_MAX_LEN 120
#define CANDS_MAX_NUM 50

enum trigger_method_id {
  setup,
  start_maintenance,
  is_maintenance_mode,
  join_maintenance_thread,
  deployer_initialize,
  prebuild,
  deploy
};
