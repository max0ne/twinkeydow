GET /repo/similar handler
===========================================

## Local Development
```
pip install numpy
python handler.py
```

## Deploy
1. setup NumPy vendor
```
curl https://codeload.github.com/vitolimandibhrata/aws-lambda-numpy/zip/master > aws-lambda-numpy.zip
unzip aws-lambda-numpy.zip
mv aws-lambda-numpy/lambda aws-lambda-numpy/lib .
rm -rf aws-lambda-numpy.zip aws-lambda-numpy
```

2.
```
sls deploy
```
