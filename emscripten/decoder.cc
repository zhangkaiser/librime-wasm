#include <iostream>
#include <stdio.h>
#include <string>
#include <emscripten/bind.h>
#include <emscripten.h>
#include <rime_api.h>
#include <rime/key_event.h>

using namespace emscripten;

#define APP_NAME "rime.decoder"
#define USER_DATA_DIR "./data"
#define SHARED_DATA_DIR "./data"
#define SPS_MAX_LEN 120
#define CANDS_MAX_NUM 50

void on_message(void* context_object,  
      RimeSessionId session_id,
      const char* message_type,
      const char* message_value
) {
  EM_ASM({
    rimeNotificationHandler(UTF8ToString($0), UTF8ToString($1));
  }, message_type, message_value);
}

class Decoder {
  public:
    Decoder(bool enable_thread = False,
      bool is_setup = False
    ) {
      rime_ = rime_get_api();

      RIME_STRUCT(RimeTraits, traits);
      set_traits(traits);

      rime_->set_notification_handler(&on_message, NULL);

      if (is_setup) {
        rime_->setup(&traits);
      }

      rime_->initialize(&traits);


      if (enable_thread) {
        Bool full_check = True;

        if (rime_->start_maintenance(full_check))
          rime_->join_maintenance_thread();
      }

      create_session();
    }

    ~Decoder() {
      rime_->finalize();
    }

    void create_session() {
      session_id_ = rime_->create_session();
      if (!session_id_) {
        fprintf(stderr, "Error creating rime session.\n");
      }
    }

    bool destroy_session() {
      return rime_->destroy_session(session_id_);
    }

    // Adapt current ChromeOS IME UI extension.
    std::string decode(std::string sps_buf) {
      
      std::string str_candidates = "";
      short int current_nums = 0;

      // if (execute_special_command(line, session_id_)) return;

      if (rime_->simulate_key_sequence(session_id_, sps_buf.c_str())) {
        get_context();
        // RimeMenu menu(context_->menu);
        RimeCandidateListIterator iterator = {0};
        if (rime_->candidate_list_begin(session_id_, &iterator)) {
          while (rime_->candidate_list_next(&iterator) && current_nums < CANDS_MAX_NUM) {
            str_candidates.append(iterator.candidate.text);
            if (iterator.candidate.comment) str_candidates.append('::' + iterator.candidate.comment);
            str_candidates.append("|");
            current_nums++;
          }
          rime_->candidate_list_end(&iterator);
        }
      }
      
      return str_candidates;
    }

    Bool process_key(std::string key) {

      rime::KeyEvent keyEvent(key);
      return rime_->process_key(session_id_, keyEvent.keycode(), keyEvent.modifier());
    }

    void clear() {
      rime_->free_commit(commit_);
      rime_->free_context(context_);
      rime_->free_status(status_);
    }

    void close() {
      rime_->destroy_session(session_id_);
    }

  private:
    RimeApi* rime_;

    RimeSessionId session_id_;
    RimeContext* context_;
    RimeStatus* status_;
    RimeCommit* commit_;

    void set_traits(RimeTraits &traits) {
      traits.app_name = APP_NAME;
      traits.user_data_dir = USER_DATA_DIR;
      traits.shared_data_dir = SHARED_DATA_DIR;
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
    .constructor<bool, bool>()
    .function("decode", &Decoder::decode)
    .function("processKey", &Decoder::process_key);
}