//
//  Licensed under MIT
//  Copyright © 2017 Alexis Campailla. All rights reserved.
//

#import "ViewController.h"
#import "TestRunner.h"

//static void callback(NSArray *args, NSString *return_id) { }

static bool initialized = false;

@interface ViewController ()
@property (weak, nonatomic) IBOutlet UILabel *lblTitle;
@property (weak, nonatomic) IBOutlet UITextView *txtStory;
@property (weak, nonatomic) IBOutlet UILabel *lblURL2;
@property (weak, nonatomic) IBOutlet UILabel *lblURL;
- (IBAction)btnUpdate:(id)sender;
@end

@implementation ViewController

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  [self.view endEditing:YES];
}

- (void)runSubTask {

}

- (void)viewDidLoad {
  [super viewDidLoad];
  // Do any additional setup after loading the view, typically from a nib.

  // Do not initialize JXcore twice
  if (initialized) return;
  initialized = true;

  // Start engine (main file will be /main.js. This is the initializer file)
  [TestRunner startEngine:@"main"];
}

- (IBAction)btnUpdate:(id)sender {
  /*
   if (!initialized)
   {
   UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Wait for JXcore"
   message:@"JXcore is not ready"
   delegate:nil
   cancelButtonTitle:@"OK"
   otherButtonTitles:nil];
   [alert show];
   } else {
   NSArray *params = [NSArray arrayWithObjects:[_txtStory text], nil];
   [JXcore callEventCallback:@"UpdateHTML" withParams:params];
   [self.view endEditing:YES];
   [_lblTitle setText:@"HTML is updated!"];


   double delayInSeconds = 2.0;
   dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
   dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
   [[self lblTitle] setText:@"Say Something!"];
   });
   }
   */
}

- (void)didReceiveMemoryWarning {
  [super didReceiveMemoryWarning];
  // Dispose of any resources that can be recreated.
}
@end
