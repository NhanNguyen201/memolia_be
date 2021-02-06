const isEmpty = string => string === "" || String(string).trim() === "" 


exports.postValidate = post => {
    const errors = {};
    if(isEmpty(post.title)) errors.title = "The title is empty";
    if(isEmpty(post.message)) errors.message = "The body is empty";
    if(isEmpty(post.selectedFile)) errors.selectedFile = "The file is empty";
    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}
