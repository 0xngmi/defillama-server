import aws from "aws-sdk";
import axios from "axios";
import type { Readable } from "stream";

const datasetBucket = "defillama-datasets";

function next21Minutedate() {
  const dt = new Date();
  dt.setHours(dt.getHours() + 1);
  dt.setMinutes(21);
  return dt;
}

export async function store(
  filename: string,
  body: string | Readable | Buffer,
  hourlyCache = false,
  compressed = true
) {
  await new aws.S3()
    .upload({
      Bucket: datasetBucket,
      Key: filename,
      Body: body,
      ACL: "public-read",
      ...(hourlyCache && {
        Expires: next21Minutedate(),
        ...(compressed && {
          ContentEncoding: "br",
        }),
        ContentType: "application/json",
      }),
    })
    .promise();
}

export async function storeDataset(filename: string, body: string | Readable, contentType = "text/csv") {
  await new aws.S3()
    .upload({
      Bucket: datasetBucket,
      Key: `temp/${filename}`,
      Body: body,
      ACL: "public-read",
      ContentType: contentType,
    })
    .promise();
}

export async function storeLiqs(filename: string, body: string | Readable, contentType = "application/json") {
  await new aws.S3()
    .upload({
      Bucket: datasetBucket,
      Key: `liqs/${filename}`,
      Body: body,
      ACL: "public-read",
      ContentType: contentType,
    })
    .promise();
}

export async function getCachedLiqs(protocol: string, chain: string) {
  const data = await new aws.S3()
    .getObject({
      Bucket: datasetBucket,
      Key: `liqs/_cache/${protocol}/${chain}/latest.json`,
    })
    .promise();
  return data.Body?.toString() ?? "";
}

export async function getExternalLiqs(protocol: string, chain: string) {
  const data = (await axios.get("https://liquidations-extra-9sja.onrender.com/" + protocol + "/" + chain)).data;
  return data;
}

export async function storeCachedLiqs(protocol: string, chain: string, body: string | Readable) {
  await new aws.S3()
    .upload({
      Bucket: datasetBucket,
      Key: `liqs/_cache/${protocol}/${chain}/latest.json`,
      Body: body,
      ACL: "public-read",
      ContentType: "application/json",
    })
    .promise();
}

export function buildRedirect(filename: string, cache?: number) {
  return {
    statusCode: 307,
    body: "",
    headers: {
      Location: `https://defillama-datasets.s3.eu-central-1.amazonaws.com/temp/${filename}`,
      ...(cache !== undefined
        ? {
            "Cache-Control": `max-age=${cache}`,
          }
        : {}),
    },
  };
}

export const liquidationsFilename = `liquidations.json`;
