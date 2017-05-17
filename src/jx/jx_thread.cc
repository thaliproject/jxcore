// Copyright & License details are available under JXCORE_LICENSE file

#include "jx_thread.h"
#include <stdlib.h>

namespace jxcore {

#ifdef JS_ENGINE_V8
JXThread JXThread::Create(void (*entry)(void *arg), void *param) {
  uv_thread_t uv_thread;
  if (!uv_thread_create(&uv_thread, entry, param))
    abort();

  return JXThread(uv_thread);
}

bool JXThread::Join(JXThread th) {
  int err = uv_thread_join(&th.uv_thread_);
  return (err == 0);
}

JXThread JXThread::GetCurrent() {
  return JXThread((uv_thread_t) uv_thread_self());
}

bool JXThread::Equals(JXThread other) {
  // This is not entirely portable. phreads should use pthread_equal, but
  // the current libuv version doesn't expose an equality API.
  // This has been fixed in later libuv versions.
  return (this->uv_thread_ == other.uv_thread_);
}

#elif defined(JS_ENGINE_MOZJS)
JXThread JXThread::Create(void (*entry)(void *arg), void *param) {
  PRThread* pr_thread = PR_CreateThread(PR_USER_THREAD, entry, param,
                         PR_PRIORITY_NORMAL, PR_GLOBAL_THREAD,
                         PR_JOINABLE_THREAD, 0);

  if (pr_thread == NULL)
    abort();
  
  return JXThread(pr_thread);
}

bool JXThread::Join(JXThread th) {
  return PR_JoinThread(th.pr_thread_) == PR_SUCCESS;
}

JXThread JXThread::GetCurrent() {
  return JXThread(PR_GetCurrentThread());
}

bool JXThread::Equals(JXThread other) {
  return (this->pr_thread_ == other.pr_thread_);
}

#endif

}  // namespace jxcore
