GET /repo/similar handler
===========================================

## Local Development
```
pip install numpy
python handler.py
```

## Deploy

0. setup vritual env, install dependencies
```
virtualenv --python=`which python3` env
source env/bin/activate
pip install pymongo
```

1.  move dependencies to root dir
```
cp -r $VIRTUAL_ENV/lib/python3.6/site-packages/pymongo .
cp -r $VIRTUAL_ENV/lib/python3.6/site-packages/bson .
```

2. setup NumPy vendor
```
rm -rf aws-lambda-numpy.zip aws-lambda-numpy-master numpy lib
curl https://codeload.github.com/max0ne/aws-lambda-numpy/zip/master > aws-lambda-numpy.zip
unzip aws-lambda-numpy.zip
mv aws-lambda-numpy-master/numpy .
mv aws-lambda-numpy-master/lib .
rm -rf aws-lambda-numpy.zip aws-lambda-numpy-master
```

3.
```
npx sls deploy
```

4. cleanup
```
rm -rf aws-lambda-numpy.zip aws-lambda-numpy-master numpy lib pymongo bson
```
