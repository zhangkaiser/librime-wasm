#include <iostream>
#include <stdio.h>
#include <string>
#include <emscripten/bind.h>
#include <emscripten.h>
#include <rime_api.h>

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
    console.log("ASM Test ->", $0, UTF8ToString($1), UTF8ToString($2));
  }, session_id, message_type, message_value);
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
      } else {
        rime_->initialize(&traits);
        if (enable_thread) {
          Bool full_check = True;

          if (rime_->start_maintenance(full_check))
            rime_->join_maintenance_thread();
        }
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

    // Adapt current ChromeOS IME UI extension.
    std::string decode(std::string sps_buf) {
      
      std::string str_candidates = "";
      short int current_nums = 0;

      // if (execute_special_command(line, session_id_)) return;

      if (rime_->simulate_key_sequence(session_id_, sps_buf.c_str())) {
        set_context();
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

    void send_key() {

    }

    void clear() {
      rime_->free_context(context_);
    }

    void close() {
      rime_->destroy_session(session_id_);
    }

  private:
    RimeApi* rime_;

    RimeSessionId session_id_;
    RimeContext* context_;

    void set_traits(RimeTraits &traits) {
      traits.app_name = APP_NAME;
      traits.user_data_dir = USER_DATA_DIR;
      traits.shared_data_dir = SHARED_DATA_DIR;
    }

    void set_context() {
      RIME_STRUCT(RimeContext, context);
      context_ = &context;
      rime_->get_context(session_id_, &context);
    }
};


EMSCRIPTEN_BINDINGS(rime_decoder) {
  class_<Decoder>("Decoder")
    .constructor<bool, bool>()
    .function("decode", &Decoder::decode);
}