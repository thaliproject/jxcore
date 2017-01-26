//
//  jxcore-callback.h
//  JXcoreHTTPServer
//
//  Created by enrico on 11/22/16.
//  Copyright © 2016 Nubisa. All rights reserved.
//

#ifndef jxcore_callback_h
#define jxcore_callback_h
#include <stdio.h>
#include "jx.h"
#include "TestRunner.h"

static void JXcoreProxy_CB(void *arg) {
    //NSLog(@"JXcoreProxy: CB.");
    [TestRunner startChildEngine];
}

static void JXcoreProxy_CreateThread() {
    //NSLog(@"JXcoreProxy: CreateThread.");
    JX_CreateRIThread(JXcoreProxy_CB);
}

#endif /* jxcore_callback_h */
