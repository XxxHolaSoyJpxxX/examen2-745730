import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export const uploadFile = async (bucketName, key, body) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: 'application/pdf',
    Metadata: {
      'hora-envio': new Date().toISOString(),
      'nota-descargada': 'false',
      'veces-enviado': '1',
    },
  };
  return s3.putObject(params).promise();
};

export const updateMetadata = async (bucketName, key, newMetadata) => {
  // Nota: AWS SDK v2 (usado aquí) no necesita el CopySource para REPLACE metadata
  await s3.copyObject({
    Bucket: bucketName,
    CopySource: `${bucketName}/${key}`,
    Key: key,
    Metadata: newMetadata,
    MetadataDirective: "REPLACE", 
  }).promise();
};

export const getFile = async (bucketName, key) => {
  const obj = await s3.getObject({
    Bucket: bucketName,
    Key: key,
  }).promise();

  return {
    Body: obj.Body,        
  };
};

export const getMetadata = async (bucketName, key) => {
  const head = await s3.headObject({
    Bucket: bucketName,
    Key: key,
  }).promise();
  return head.Metadata; 
};

export const deleteFile = async (bucketName, key) => {
  const params = {
	Bucket: bucketName,
	Key: key,
  };
  return s3.deleteObject(params).promise();
}