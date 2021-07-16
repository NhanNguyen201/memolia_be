const isEmpty = string => string === "" || String(string).trim() === "" 


exports.postValidate = post => {
    const errors = {};
    if(isEmpty(post.title)) errors.title = "The title is empty";
    if(post.selectedFiles.length === 0) errors.selectedFile = "The file is empty";
    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}
