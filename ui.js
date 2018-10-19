var ui = {
    get_batch_size: () => +document.getElementById("batch_size").value,
    get_train_batches: () => +document.getElementById("train_batches").value,
    get_epochs: () => +document.getElementById("epochs").value,
    get_record_loss: () => +document.getElementById("record_loss").value,
    get_validation_examples: () => +document.getElementById("validation_examples").value,
    get_test_examples: () => +document.getElementById("test_examples").value
}

