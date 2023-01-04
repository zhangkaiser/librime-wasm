#include <iostream>
#include <stdio.h>
#include <string>
#include <emscripten/bind.h>
#include <emscripten.h>
#include <rime_api.h>
#include <rime/key_event.h>

#include "define.h"
using namespace emscripten;
using namespace std;

void on_message(void* context_object,  
      RimeSessionId session_id,
      const char* message_type,
      const char* message_value
) {
  EM_ASM({
    imeHandler.onNotification(UTF8ToString($0), UTF8ToString($1));
  }, message_type, message_value);

  RimeApi* rime = rime_get_api();
  if (RIME_API_AVAILABLE(rime, get_state_label) 
    && !strcmp(message_type, "option")
  ) {
    Bool state = message_value[0] != '!';
    const char* option_name = message_value + !state;
    const char* state_label =
        rime->get_state_label(session_id, option_name, state);
    if (state_label) {
      printf("updated option: %s = %d // %s\n", option_name, state, state_label);
    }
  }

}

class Decoder {
  public:
    Decoder() {
      rime_ = rime_get_api();

      RIME_STRUCT(RimeTraits, traits);
      set_traits(traits);
      traits_ = &traits;

      rime_->set_notification_handler(&on_message, NULL);
    }

    ~Decoder() {
      rime_->finalize();
    }

    bool initialize(
      bool is_setup = False
    ) {
      if (is_setup) {
        rime_->setup(traits_);
        rime_->initialize(NULL);

      } else rime_->initialize(traits_);

      return create_session();
    }

    bool create_session() {
      session_id_ = rime_->create_session();
      if (!session_id_) {
        fprintf(stderr, "Error creating rime session.\n");
        return False;
      }
      return True;
    }

    bool update() {
      
      rime_->setup(traits_);
      rime_->initialize(NULL);

      bool full_check = True;
      if (rime_->start_maintenance(full_check)) {
        rime_->join_maintenance_thread();
      }

      fprintf(stdout, "Update success.");
      rime_->finalize();
      return True;
    }

    void notify_update() {

      // rime_->get_input(): get raw input.

      if (get_commit()) {
        EM_ASM({
          imeHandler.commitText(UTF8ToString($0));
        }, commit_->text);

        rime_->free_commit(commit_);
      }

      if (get_status() && status_->is_composing) {
        if (get_context() && context_->composition.length > 0) {
          const char* preedit = context_->composition.preedit;
          if (!preedit) return;
          // size_t len = strlen(preedit);
          size_t start = context_->composition.sel_start;
          size_t end = context_->composition.sel_end;
          size_t cursor = context_->composition.cursor_pos;

          EM_ASM({
            imeHandler.setComposition({
              preedit: UTF8ToString($0),
              start: $1,
              end: $2,
              cursor: $3
            });
          }, preedit, start, end, cursor);
        }

        if (context_->menu.num_candidates > 0) {
          EM_ASM({
            imeHandler.setCandidateWindowProperties({
              selectKeys: UTF8ToString($0),
              pageSize: $1,
              pageNo: $2,
              isLastPage: $3,
              hightlighed: $4,
              candidatesSize: $5
            });
          }, 
            context_->menu.select_keys,
            context_->menu.page_size, 
            context_->menu.page_no,
            context_->menu.is_last_page,
            context_->menu.highlighted_candidate_index,
            context_->menu.num_candidates
          );

          for (int i = 0; i < context_->menu.num_candidates; ++i) {
            EM_ASM({
              imeHandler.addCandidate(UTF8ToString($0), UTF8ToString($1));
            }, 
              context_->menu.candidates[i].text, 
              context_->menu.candidates[i].comment
            );
          }

          rime_->free_context(context_);
        }

        rime_->free_status(status_);
      } else {
        EM_ASM({
          imeHandler.clearComposition();
          imeHandler.hide();
        }, 0);
      }
    }

    Bool destroy_session() {
      return rime_->destroy_session(session_id_);
    }

    Bool trigger_method(short int number) {
      return True;
    }

    Bool execute_command(std::string line) {

      const char *linec = line.c_str();

      if (strcmp(linec, "build")) {
        rime_->setup(traits_);
      }
      
      if (strcmp(linec, "getSchemaList")) {
        // EM_ASM({})
      }

      if (strcmp(linec, "openUserConfig")) {
        // rime_->user_config_open()
        // Adapter config file edit.
      }

      if (strcmp(linec, "setOption")) {

      }

      if (strcmp(linec, "getOption")) {

      }

      return False;
    }

    Bool process_key(std::string key) {

      rime::KeyEvent keyEvent(key);
      return rime_->process_key(session_id_, keyEvent.keycode(), keyEvent.modifier());
    }

    Bool decode(std::string key) {
      return True;
    }

    void close() {
      rime_->destroy_session(session_id_);
    }

    std::string get_version() {
      std::string version = rime_->get_version();
      return version;
    }

  private:
    RimeApi* rime_;

    RimeSessionId session_id_;
    RimeContext *context_;
    RimeStatus *status_;
    RimeCommit *commit_;
    RimeTraits *traits_;

    void set_traits(RimeTraits &traits) {
      traits.app_name = APP_NAME;
      traits.user_data_dir = USER_DATA_DIR;
      traits.shared_data_dir = SHARED_DATA_DIR;
      traits.prebuilt_data_dir = BUILT_DATA_DIR;
      traits.staging_dir = BUILT_DATA_DIR;
      // traits.min_log_level = MIN_LOG_LEVEL;
    }

    Bool get_context() {
      RIME_STRUCT(RimeContext, context);
      context_ = &context;
      return rime_->get_context(session_id_, &context);
    }

    Bool get_commit() {
      RIME_STRUCT(RimeCommit, commit);
      commit_ = &commit;
      return rime_->get_commit(session_id_, &commit);
    }

    Bool get_status() {
      RIME_STRUCT(RimeStatus, status);
      status_ = &status;
      return rime_->get_status(session_id_, &status);
    }

};


EMSCRIPTEN_BINDINGS(rime_decoder) {
  class_<Decoder>("Decoder")
    .constructor<>()
    .function("processKey", &Decoder::process_key)
    .function("notifyUpdate", &Decoder::notify_update)
    .function("close", &Decoder::close)
    .function("executeCommand", &Decoder::execute_command)
    .function("triggerMethod", &Decoder::trigger_method)
    .function("decode", &Decoder::decode)
    .function("update", &Decoder::update)
    .function("initialize",&Decoder::initialize)
    ;
}