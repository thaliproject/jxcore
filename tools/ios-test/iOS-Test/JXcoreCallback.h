//
//  Licensed under MIT
//  Copyright © 2017 Enrico Giordani. All rights reserved.
//

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
