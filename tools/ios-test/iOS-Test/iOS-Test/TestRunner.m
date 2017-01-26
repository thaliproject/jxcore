/*
JXcore Objective-C bindings
The MIT License (MIT)

Copyright (c) 2015 Oguz Bastemur

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

#import "TestRunner.h"

#include "jxcore-callback.h"
#include <sys/types.h>
#include <sys/sysctl.h>

// ugly but takes care of XCODE 6 i386 compile bug
size_t fwrite$UNIX2003(const void *a, size_t b, size_t c, FILE *d) {
  return fwrite(a, b, c, d);
}
char *strerror$UNIX2003(int errnum) { return strerror(errnum); }
time_t mktime$UNIX2003(struct tm *a) { return mktime(a); }
double strtod$UNIX2003(const char *a, char **b) { return strtod(a, b); }
void fputs$UNIX2003(const char *restrict c, FILE *restrict f) { fputs(c, f); }

@interface CPPWrapper:NSObject
{}
- (JXcoreNative) getCallback;
- (void) setCallback:(JXcoreNative)native;
- (JXValue*) getFunction;
- (void) setFunction:(JXValue*)fnc;
@end

@implementation CPPWrapper {
  JXcoreNative native_;
  JXValue jxvalue_;
}

- (JXcoreNative) getCallback {
  return native_;
}

- (void) setCallback:(JXcoreNative)native {
  native_ = native;
}

- (JXValue*) getFunction {
  return &jxvalue_;
}

- (void) setFunction:(JXValue*)fnc {
  jxvalue_ = *fnc;
}
@end

@interface NativeCall : NSObject
{}
- (void) setName:(NSString*)name withParams:(NSArray*)arr isJSON:(BOOL)is_json;
@end

@implementation NativeCall {
  NSString *name_;
  NSArray *arr_;
  BOOL is_json_;
}

- (NSString*) getName
{
  return name_;
}

- (NSArray*) getParams
{
  return arr_;
}

- (BOOL) getIsJSON
{
  return is_json_;
}

- (void) setName:(NSString*)name withParams:(NSArray*)arr  isJSON:(BOOL)is_json {
  name_ = [NSString stringWithString:name];
  arr_ = [NSArray arrayWithArray:arr];
  is_json_ = is_json;
}
@end

@implementation JXNull

- (id) init
{
  self = [super init];
  return self;
}

- (BOOL) isNull {
  return TRUE;
}

@end

@implementation JXBoolean {
  BOOL boolValue;
}

- (id) init
{
  self = [super init];
  boolValue = FALSE;
  return self;
}

- (BOOL) getBoolean {
  return boolValue;
}

- (void) setBoolean:(BOOL)value {
  boolValue = value;
}

@end

@implementation JXJSON {
  NSString* stringValue;
}

- (id) init
{
  self = [super init];
  stringValue = nil;
  return self;
}

- (NSString*) getString {
  return stringValue;
}

- (void) setString:(NSString*)value {
  stringValue = [NSString stringWithString:value];
}

@end


static NSMutableDictionary *natives;

void ConvertParams(JXValue *results, int argc, NSMutableArray *params) {
  for (int i=0; i<argc; i++) {
    JXValue *result = results+i;
    NSObject *objValue = nil;

    switch (result->type_) {
      case RT_Boolean: {
        bool bl = JX_GetBoolean(result);
        JXBoolean *nmr = [[JXBoolean alloc] init];
        [nmr setBoolean:bl];
        objValue = nmr;
      } break;
      case RT_Int32: {
        int nt = JX_GetInt32(result);
        objValue = [NSNumber numberWithInt:nt];
      } break;
      case RT_Double: {
        double nt = JX_GetDouble(result);
        objValue = [NSNumber numberWithDouble:nt];
      } break;
      case RT_Buffer: {
        char *data = JX_GetString(result);
        int32_t len = JX_GetDataLength(result);
        objValue =
            [NSData dataWithBytes:(const void *)data length:sizeof(char) * len];
        free(data);
      } break;
      case RT_Object: {
        char *data = JX_GetString(result);
        int ln = JX_GetDataLength(result);
        if (ln > 0 && *data != '{' && *data != '[') {
          objValue = [NSString stringWithUTF8String:data];
        } else {
          NSString *strJSON = [NSString stringWithUTF8String:data];
          JXJSON *json = [[JXJSON alloc] init];
          [json setString:strJSON];
        
          objValue = json;
        }
        free(data);
      } break;
      case RT_Error:
      case RT_String: {
        char *data = JX_GetString(result);
        objValue = [NSString stringWithUTF8String:data];

        free(data);
      } break;
      default:
        objValue = [[JXNull alloc] init];
        break;
    }

    [params addObject:objValue];
  }
}


@implementation TestRunner

static bool mainEngineInitialized = false;
static NSThread *childEngineThread = nil;
static NSMutableArray *operationQueue;
static NSCondition *operationCheck;
static NSMutableArray *scriptsQueue;
static NSMutableArray *nativeCallsQueue;
static NSString *requiredFile;
//static float delay = 0;

+ (NSArray*) listTests:(NSString*)path
{
  NSArray *dirContents = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:NULL];
  NSPredicate *filter = [NSPredicate predicateWithFormat:@"self BEGINSWITH 'test-' AND self ENDSWITH '.js'"];
  NSArray *tests = [dirContents filteredArrayUsingPredicate:filter];
  return tests;
}

+ (void)startEngine:(NSString*)fileName
{
  
  assert(mainEngineInitialized == false && "You can start JXcore main engine only once");
  mainEngineInitialized = true;
  
  natives = [[NSMutableDictionary alloc] init];
  operationQueue = [[NSMutableArray alloc] init];
  operationCheck = [[NSCondition alloc] init];
  scriptsQueue = [[NSMutableArray alloc] init];
  nativeCallsQueue = [[NSMutableArray alloc] init];

  NSString *sandboxPath = NSHomeDirectory();
  //NSLog(@"sandbox %@", sandboxPath);
  
  NSString *filePath = [[NSBundle mainBundle] pathForResource:fileName ofType:@"js"];
  //NSLog(@"filePath %@", filePath);
  
  NSString *homeFolder = sandboxPath;
 
  NSUInteger location = [filePath rangeOfString:[NSString stringWithFormat:@"/%@.js", fileName]].location;
  //NSLog(@"location %ld", (unsigned long) location);
  
  if (location > 0) {
    homeFolder = [NSString stringWithFormat:@"%@/",[filePath substringToIndex:location]];
    //NSLog(@"fileDir %@", homeFolder);
  }
  

  
  NSString *fileContents = @"console.log('Main engine script done.');";

  JX_InitializeOnce([homeFolder UTF8String]);
  JX_InitializeNewEngine();
  JX_DefineMainFile([fileContents UTF8String]);
  JX_StartEngine();


  int passed = 0;
  int failed = 0;
  //int skipped = 0;
  NSMutableArray *failedTests = [NSMutableArray new];
  
  //NSString *requiredFileTemplate = @"setTimeout(function() { throw new Error('Test timed out!'); }, 60*1000); require('test/simple/%@');";
  //NSString *requiredFileTemplate = @"setTimeout(function() { console.error('Test timed out!'); process.exit(1); }, 60*1000); require('test/simple/%@');";
  NSString *requiredFileTemplate = @"require('test/simple/%@');";
  NSString *simpleTestsPath = [NSString stringWithFormat:@"%@/test/simple/",homeFolder];
  int i;
  
  NSArray *tests = [self listTests:simpleTestsPath];

  for (i = 0; i < (int)[tests count]; i++)
  {
    NSLog([NSString stringWithFormat:@"%d: %@", i, [tests objectAtIndex:i]]);
  }

  NSLog(@"Running %d tests...", [tests count]);
  //for (i = 0; i < 300; i++)
  //for (i = 300; i < (int)[tests count]; i++)
  for (i = 0; i < (int)[tests count]; i++)
  {
    NSString *testTmpFolder = [NSString stringWithFormat:@"%@/%@", homeFolder, @"test/tmp"];
    BOOL isDir;
    if ([[NSFileManager defaultManager] fileExistsAtPath:testTmpFolder isDirectory:&isDir] && isDir) {
      //NSLog(@"delete tmp folder");
      [[NSFileManager defaultManager] removeItemAtPath:testTmpFolder error:nil];
    }
    //NSLog(@"create tmp folder");
    NSError *error = nil;
    [[NSFileManager defaultManager] createDirectoryAtPath:testTmpFolder withIntermediateDirectories:YES attributes:nil error:&error];
    
    requiredFile = [NSString stringWithFormat:requiredFileTemplate, [tests objectAtIndex:i]];
    NSLog(@"Test %d: %@", i, [tests objectAtIndex:i]);
    JXcoreProxy_CreateThread();
    
    [operationCheck lock];
    [operationCheck wait];
    [operationCheck unlock];
    JX_JoinRIThread();
    
    int result = JX_ProcessExitResult();
    if (result == 0) {
      passed++;
    }
    else {
      failed++;
      NSString *failedTest = [NSString stringWithFormat:@"%d %@", i, [tests objectAtIndex:i]];
      [failedTests addObject:failedTest];
      //break;
    }
    NSLog(@"Passed %d | Failed %d", passed, failed);
  }
  
  for (i = 0; i < (int)[failedTests count]; i++) {
    NSString *testName =[NSString stringWithFormat:@"%@",[failedTests objectAtIndex:i]];
    fprintf(stdout, "%s\n", [testName UTF8String]);
  }
  
  NSLog(@"Done.");
  exit(0);
}

+ (void)startChildEngine
{
  childEngineThread = [NSThread currentThread];

  JX_InitializeNewEngine();  JX_DefineMainFile([requiredFile UTF8String]);
  JX_StartEngine();
  //NSLog(@"Engine started.");

  while(JX_LoopOnce() != 0) {[NSThread sleepForTimeInterval:0.01f];};
  //NSLog(@"Loop done.");

  JX_StopEngine();
  //NSLog(@"Engine done.");
  
  [operationCheck lock];
  [operationCheck signal];
  [operationCheck unlock];
}


+ (void)stopChildThread
{
  [operationCheck lock];
  {
    [childEngineThread cancel];
    [operationCheck signal];
  }
  [operationCheck unlock];
}

@end
