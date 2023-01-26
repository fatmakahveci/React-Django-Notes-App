import React, { Component } from "react";
import { Link } from "react-router-dom";
import {
    Container,
    Button,
    Row,
    Col,
    Form,
    FormControl
} from "react-bootstrap";

class Signup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            username: "",
            password: ""
        };
    }

    onChange = e => {
        this.setState({ [e.target.name]: e.target.value });
    };

    onSignupClick = () => {
        const userData = {
            username: this.state.username,
            password: this.state.password
        };
    };

    render() {
        return (
            <Container>
                <Form>
                    
                </Form>
            </Container>
        );
    }
}

export default Signup;