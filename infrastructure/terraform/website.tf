resource "aws_cloudfront_response_headers_policy" "website" {
  name = "arcade-actions-website"
  security_headers_config {
    content_security_policy {
      content_security_policy = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
      override                = true
    }
    content_type_options { override = true }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "no-referrer"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      override                   = true
    }
  }
}

module "website" {
  source = "git::https://github.com/chris-arsenault/ahara-tf-patterns.git//modules/website?ref=fff59f90fcf84b58d9328fa58b87e51414bec008"

  prefix                     = "arcade-actions"
  hostname                   = "arcade-actions.ahara.io"
  site_directory             = "${path.module}/../../frontend/dist"
  response_headers_policy_id = aws_cloudfront_response_headers_policy.website.id
  encrypt                    = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = module.website.bucket_name
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

output "url" { value = module.website.url }
output "bucket_name" { value = module.website.bucket_name }
output "distribution_id" { value = module.website.distribution_id }
