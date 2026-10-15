mock_provider "aws" {
  override_during = plan
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "559098897826"
      arn        = "arn:aws:iam::559098897826:role/synthetic-test"
      user_id    = "synthetic-test"
    }
  }
  mock_data "aws_route53_zone" {
    defaults = { zone_id = "ZARCADESYNTHETIC", name = "ahara.io." }
  }
}

override_resource {
  target          = module.website.aws_acm_certificate.this
  override_during = plan
  values = {
    arn = "arn:aws:acm:us-east-1:559098897826:certificate/00000000-0000-0000-0000-000000000000"
    domain_validation_options = [{
      domain_name           = "arcade-actions.ahara.io"
      resource_record_name  = "_synthetic.arcade-actions.ahara.io"
      resource_record_type  = "CNAME"
      resource_record_value = "synthetic.acm-validations.aws."
    }]
  }
}

run "static_website" {
  command = plan
  assert {
    condition     = fileexists("${path.module}/../../frontend/dist/index.html")
    error_message = "Build the frontend before checking its deployment."
  }
  assert {
    condition     = module.website.hostname == "arcade-actions.ahara.io"
    error_message = "Hosting must use the Arcade Actions hostname."
  }
  assert {
    condition     = one(aws_s3_bucket_server_side_encryption_configuration.assets.rule).apply_server_side_encryption_by_default[0].sse_algorithm == "AES256"
    error_message = "Assets must use S3-managed encryption without a new KMS key."
  }
}
