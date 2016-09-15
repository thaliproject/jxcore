# Call this script like this: 'test/test.sh simple'
# This script is an alternative to test/test.js that
# doesn't run properly on Android Nougat

TMP_DIR="test/tmp"
TEST_OUTPUT_TMP="test_output_tmp"
TEST_RESULT_PASS="test_result_$1_pass"
TEST_RESULT_SKIP="test_result_$1_skip"
TEST_RESULT_FAIL="test_result_$1_fail"
TEST_RESULT_FAIL_LIST="test_result_$1_fail_list"

DIV="-------------------------------------------------------------------------------"

PASS=0
FAIL=0
SKIP=0
TOTAL=0

rm -rf $TEST_RESULT_PASS
rm -rf $TEST_RESULT_SKIP
rm -rf $TEST_RESULT_FAIL
rm -rf $TEST_RESULT_FAIL_LIST

# COPY_TEST_OUTPUT arguments:
# $1 is the test file name
# $2 is TEST_RESULT_[PASS|SKIP|FAIL] file
function COPY_TEST_OUTPUT () {
    echo $1 >> $2
    cat $TEST_OUTPUT_TMP >> $2
    echo $DIV >> $2
}

if [ $# -eq 0 ]
  then
    echo "Missing test folder argument"
    exit 1
fi

echo $DIV
for file in test/$1/test-*.js
do
    if [[ -f $file ]]; then
        echo $file
        # Create a clean tmp folder for each test
        rm -rf $TMP_DIR
        mkdir $TMP_DIR
        # Run the test
        ./jx $file &> $TEST_OUTPUT_TMP
        if [ $? -eq 0 ]; then
            if grep -q "Skipping:" $TEST_OUTPUT_TMP; then
                ((SKIP++))
                echo "SKIP"
                COPY_TEST_OUTPUT $file $TEST_RESULT_SKIP
            else
                ((PASS++))
                COPY_TEST_OUTPUT $file $TEST_RESULT_PASS
            fi
        else
            ((FAIL++))
            echo "FAIL"
            echo $file >> $TEST_RESULT_FAIL_LIST
            COPY_TEST_OUTPUT $file $TEST_RESULT_FAIL
        fi
        echo $DIV
    fi
done
TOTAL=$(($PASS + $SKIP + $FAIL))
echo "[T $TOTAL|+ $PASS|= $SKIP|- $FAIL]"

