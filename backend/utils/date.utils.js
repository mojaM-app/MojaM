const toUtcDate = (date) => {
    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0,
            0,
            0,
            0)
    );
};

export default {
    toUtcDate
}