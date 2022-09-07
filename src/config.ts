export const mongodbConfigSchema = {
    "type": [
        "object"
    ],
    "properties": {
        "servers": {
            "minItems": 1,
            "type": [
                "array"
            ],
            "items": {
                "type": [
                    "object"
                ],
                "properties": {
                    "host": {
                        "format": "uri-reference",
                        "type": [
                            "string"
                        ]
                    },
                    "port": {
                        "minimum": 1,
                        "maximum": 65535,
                        "default": 27017,
                        "type": [
                            "integer"
                        ]
                    }
                }
            }
        },
        "replicaSet": {
            "type": [
                "string"
            ]
        },
        "user": {
            "type": [
                "string"
            ]
        },
        "password": {
            "type": [
                "string"
            ]
        },
        "db": {
            "type": [
                "string"
            ]
        },
        "x509": {
            "type": [
                "object"
            ],
            "properties": {
                "ca": {
                    "type": [
                        "string"
                    ]
                },
                "cert": {
                    "type": [
                        "string"
                    ]
                },
                "key": {
                    "type": [
                        "string"
                    ]
                }
            }
        },
        "name": {
            "type": [
                "string"
            ]
        },
        "timeoutMs": {
            "type": [
                "integer"
            ]
        },
        "ssl": {
            "type": [
                "boolean"
            ]
        },
        "srv": {
            "type": [
                "boolean"
            ]
        },
        "retryWrites": {
            "type": [
                "boolean"
            ]
        },
        "authSource": {
            "type": [
                "string"
            ]
        },
        "authMechanism": {
            "type": [
                "string"
            ]
        }
    }
};
