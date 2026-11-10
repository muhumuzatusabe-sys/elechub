# Batch Generation

Input example:
candidate_name,position,photo,slogan,faculty,year,phone,social_handle

Pipeline:
Upload -> Parse -> Map -> Validate -> Preview -> Queue -> Render -> Validate -> Package -> Export.

Expose queued, processing, completed and failed counts and percentage.

A failed item must retain its record identifier and failure reason and support retry. Successful items remain available.
