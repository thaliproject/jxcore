// Copyright & License details are available under JXCORE_LICENSE file

#ifndef SRC_JX_THREAD_H_
#define SRC_JX_THREAD_H_

#ifndef JXCORE_EXTERN
#ifdef _WIN32
#define JXCORE_EXTERN(x) __declspec(dllexport) x
#else
#define JXCORE_EXTERN(x) x
#endif
#endif

#if defined(JS_ENGINE_MOZJS)
#if !defined(_MSC_VER)
#include "vm/PosixNSPR.h"
#else
#include "../deps/mozjs/incs/nss/nspr/pr/include/prthread.h"
#endif
#elif defined(JS_ENGINE_V8)
#include "uv.h"
#endif

namespace jxcore {

class JXThread {
#ifdef JS_ENGINE_V8
  uv_thread_t uv_thread_;
  JXThread(uv_thread_t uv_thread) { uv_thread_ = uv_thread; }
#elif defined(JS_ENGINE_MOZJS)
  PRThread* pr_thread_;
  JXThread(PRThread* pr_thread) { pr_thread_ = pr_thread; }
#endif

public:
  JXThread() {}
  static JXThread Create(void (*entry)(void *arg), void *param);
  static bool Join(JXThread th);
  static JXThread GetCurrent();
  bool Equals(JXThread other);
};
} // namespace jxcore
#endif  // SRC_JX_THREAD_H_
